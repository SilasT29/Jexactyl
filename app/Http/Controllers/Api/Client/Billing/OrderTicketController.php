<?php

namespace Everest\Http\Controllers\Api\Client\Billing;

use Everest\Models\Egg;
use Everest\Models\Node;
use Everest\Models\Server;
use Everest\Models\Ticket;
use Everest\Models\User;
use Everest\Models\Billing\Order;
use Everest\Models\Billing\Product;
use Everest\Exceptions\DisplayException;
use Everest\Services\Billing\DiscountService;
use Everest\Services\Billing\CreateOrderService;
use Everest\Http\Controllers\Api\Client\ClientApiController;
use Everest\Http\Requests\Api\Client\Billing\CreateOrderTicketRequest;
use Everest\Models\TicketMessage;

class OrderTicketController extends ClientApiController
{
    public function __construct(
        private DiscountService $discountService,
        private CreateOrderService $orderService,
    ) {
        parent::__construct();
    }

    /**
     * Create a pending order and a support ticket for staff review.
     * No money is charged.
     */
    public function create(CreateOrderTicketRequest $request): array
    {
        $user = $request->user();
        $nodeId = $request->input('node_id') ?? null;
        $serverId = $request->input('server_id') ?? null;
        $product = Product::findOrFail($request->input('product_id'));

        if (!$product->isPaid()) {
            throw new DisplayException('Free products cannot be ordered through the manual ticket flow.');
        }

        $isRenewal = (bool) $serverId;
        $orderType = $isRenewal ? Order::TYPE_RENEWAL : Order::TYPE_NEW;
        $node = null;
        $deploymentFee = 0.0;
        $server = null;

        if ($isRenewal) {
            $server = $user->servers()->where('id', $serverId)->firstOrFail();
        } elseif ($nodeId) {
            $node = Node::findOrFail($nodeId);

            if (!$node->deployable) {
                throw new DisplayException('Paid servers cannot be deployed to this node.');
            }

            $deploymentFee = (float) ($node->deployment_fee ?? 0);
        } else {
            throw new DisplayException('A valid deployment node must be selected.');
        }

        $eggId = !$isRenewal ? $this->resolveEggSelection($product, $request->input('egg_id')) : null;
        $variables = $request->input('variables') ?? [];
        $discountCode = $request->input('discount_code');
        $price = $product->price;

        if ($discountCode) {
            $price = $this->discountService->handle($product, $discountCode);
        }

        $metadata = [
            'deployment_fee' => $deploymentFee > 0 ? $deploymentFee : null,
            'discount_code' => $discountCode ?? null,
            'subtotal' => $product->price,
            'node_id' => $node?->id,
            'server_id' => $server?->id,
            'egg_id' => $eggId,
            'variables' => json_encode($variables),
        ];

        $order = $this->orderService->create(
            null,
            $user,
            $product,
            Order::STATUS_PENDING_PAYMENT,
            $orderType,
            $price,
            array_filter($metadata, fn ($value) => $value !== null) ?: null
        );

        if ($server) {
            $order->assignServer($server);
        }

        $ticket = $this->createTicket($order, $user, $product, $node, $server, $price, $deploymentFee, $discountCode, $variables);

        return [
            'order_id' => $order->id,
            'ticket_id' => $ticket->id,
        ];
    }

    /**
     * Create a support ticket containing the order details for staff review.
     */
    private function createTicket(
        Order $order,
        User $user,
        Product $product,
        ?Node $node,
        ?Server $server,
        float $price,
        float $deploymentFee,
        ?string $discountCode,
        array $variables
    ): Ticket {
        $currency = config('modules.billing.currency.symbol', '$');
        $grandTotal = $price + $deploymentFee;

        $subject = sprintf('New order #%d: %s', $order->id, $product->name);

        $lines = [
            $server
                ? sprintf('A server renewal request for order #%d has been submitted and is awaiting staff review.', $order->id)
                : sprintf('A new order (#%d) has been submitted and is awaiting staff review.', $order->id),
            '',
            sprintf('**Customer:** %s (ID: %d)', $user->email, $user->id),
            sprintf('**Product:** %s', $product->name),
            sprintf('**Price:** %s%.2f / month', $currency, $price),
        ];

        if ($deploymentFee > 0) {
            $lines[] = sprintf('**Deployment fee:** %s%.2f', $currency, $deploymentFee);
        }

        $lines[] = sprintf('**Total due:** %s%.2f', $currency, $grandTotal);

        if ($server) {
            $lines[] = sprintf('**Server:** %s (ID: %d)', $server->name, $server->id);
        } elseif ($node) {
            $lines[] = sprintf('**Node:** %s (ID: %d)', $node->name, $node->id);
        }

        if ($discountCode) {
            $lines[] = sprintf('**Discount code:** %s', $discountCode);
        }

        $decodedVariables = is_string($variables) ? json_decode($variables, true) : $variables;
        if (!empty($decodedVariables)) {
            $lines[] = '';
            $lines[] = '**Selected server variables:**';
            foreach ($decodedVariables as $variable) {
                if (is_array($variable) && !empty($variable['key'])) {
                    $lines[] = sprintf('- %s: %s', $variable['key'], $variable['value'] ?? '');
                }
            }
        }

        $lines[] = '';
        $lines[] = 'Use the Create Server button once payment has been received to provision the ordered server.';

        $ticket = Ticket::create([
            'user_id' => $user->id,
            'title' => $subject,
            'status' => Ticket::STATUS_PENDING,
        ]);

        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'message' => implode("\n", $lines),
        ]);

        return $ticket;
    }

    /**
     * Validate the egg a customer selected for a product whose category doesn't pin one.
     */
    private function resolveEggSelection(Product $product, mixed $submittedEggId): ?int
    {
        if ($product->category->egg_id) {
            return null;
        }

        if (!$submittedEggId) {
            throw new DisplayException('An egg must be selected to deploy this product.');
        }

        $egg = Egg::findOrFail($submittedEggId);

        if ((int) $egg->nest_id !== (int) $product->category->nest_id) {
            throw new DisplayException('The selected egg does not belong to this product\'s nest.');
        }

        return $egg->id;
    }
}
