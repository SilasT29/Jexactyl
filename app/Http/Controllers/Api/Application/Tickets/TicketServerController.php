<?php

namespace Everest\Http\Controllers\Api\Application\Tickets;

use Everest\Models\User;
use Everest\Models\Server;
use Everest\Models\Ticket;
use Everest\Models\Billing\Order;
use Everest\Exceptions\DisplayException;
use Everest\Models\TicketMessage;
use Everest\Models\Billing\BillingException;
use Everest\Services\Billing\ServerDeploymentService;
use Everest\Transformers\Api\Application\ServerTransformer;
use Everest\Http\Requests\Api\Application\Tickets\CreateServerFromTicketRequest;
use Everest\Http\Controllers\Api\Application\ApplicationApiController;

class TicketServerController extends ApplicationApiController
{
    public function __construct(
        private ServerDeploymentService $deploymentService,
    ) {
        parent::__construct();
    }

    /**
     * Create a server for an order linked to a ticket.
     *
     * @throws \Throwable
     */
    public function create(Ticket $ticket, CreateServerFromTicketRequest $request): array
    {
        $orderId = $this->resolveOrderIdFromTicket($ticket);

        $order = $orderId
            ? Order::where('id', $orderId)->where('status', Order::STATUS_PENDING_PAYMENT)->where('type', Order::TYPE_NEW)->first()
            : Order::where('user_id', $ticket->user_id)
                ->where('status', Order::STATUS_PENDING_PAYMENT)
                ->where('type', Order::TYPE_NEW)
                ->orderBy('id', 'desc')
                ->first();

        if (!$order) {
            throw new DisplayException('No pending order was found for this ticket.');
        }

        if ($order->user_id !== $ticket->user_id) {
            throw new DisplayException('The ticket owner does not match the order owner.');
        }

        $metadata = $order->metadata ?? [];
        $user = User::findOrFail($order->user_id);
        $product = $order->product;

        if (!$product) {
            throw new DisplayException('The product associated with this order no longer exists.');
        }

        if (empty($metadata['node_id'])) {
            throw new DisplayException('This order does not have a deployment node configured.');
        }

        try {
            $server = $this->deploymentService->handle($user, $product, $metadata, $order);
            $order->assignServer($server);
            $order->setStatus(Order::STATUS_PROCESSED);
        } catch (DisplayException $exception) {
            BillingException::create([
                'order_id' => $order->id,
                'exception_type' => BillingException::TYPE_DEPLOYMENT,
                'title' => 'Failed to create server from ticket',
                'description' => $exception->getMessage(),
            ]);

            throw new DisplayException('Unable to create server: ' . $exception->getMessage());
        }

        $this->postServerCreatedMessage($ticket, $server, $order, $request);

        return $this->transform($server, ServerTransformer::class);
    }

    /**
     * Try to extract an order ID from the ticket subject (e.g. "New order #123: Product").
     */
    private function resolveOrderIdFromTicket(Ticket $ticket): ?int
    {
        if (preg_match('/New order #(\d+):/i', $ticket->title, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }

    /**
     * Post a reply to the ticket with the newly created server details.
     */
    private function postServerCreatedMessage(Ticket $ticket, Server $server, Order $order, CreateServerFromTicketRequest $request): void
    {
        try {
            $primaryAllocation = $server->allocations()->where('is_default', true)->first();
        } catch (\Illuminate\Database\QueryException $e) {
            $primaryAllocation = $server->allocation;
        }
        $address = $primaryAllocation ? sprintf('%s:%d', $primaryAllocation->ip, $primaryAllocation->port) : 'N/A';

        $message = sprintf(
            "The ordered server has been created and is ready for use.\n\n" .
            "**Server:** %s\n" .
            "**Identifier:** %s\n" .
            "**Address:** %s\n" .
            "**Order ID:** #%d\n\n" .
            "The customer can now log in and manage their server from the dashboard.",
            $server->name,
            $server->uuidShort,
            $address,
            $order->id
        );

        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'message' => $message,
        ]);
    }
}
