<?php

namespace Everest\Http\Requests\Api\Application\Tickets;

use Everest\Models\AdminRole;
use Everest\Http\Requests\Api\Application\ApplicationApiRequest;

class CreateServerFromTicketRequest extends ApplicationApiRequest
{
    public function rules(): array
    {
        return [];
    }

    public function permission(): string
    {
        return AdminRole::TICKETS_CREATE_SERVER;
    }
}
