<?php

namespace Everest\Http\Middleware\Api\Client;

use Everest\Models\Server;
use Illuminate\Routing\Middleware\SubstituteBindings;

class SubstituteClientBindings extends SubstituteBindings
{
    /**
     * @param \Illuminate\Http\Request $request
     */
    public function handle($request, \Closure $next): mixed
    {
        // Override default behavior of the model binding to use a specific table
        // column rather than the default 'id'.
        $this->router->bind('server', function ($value) {
            // Akzeptiert: uuidShort (8 Zeichen), volle UUID, serv_-Identifier und
            // UUID-Präfixe (damit ein kopierter UUID-Anfang nicht zum 404 führt).
            if (str_starts_with($value, 'serv_')) {
                return Server::query()->whereIdentifier($value)->firstOrFail();
            }

            $server = Server::query()
                ->where(fn ($q) => $q->where('uuidShort', $value)->orWhere('uuid', $value))
                ->first();

            if ($server) {
                return $server;
            }

            // Fallback: Präfix der vollen UUID (z.B. "5119d7aa" oder "5119d7aa-e08a")
            return Server::query()->where('uuid', 'LIKE', $value . '%')->firstOrFail();
        });

        $this->router->bind('user', function ($value, $route) {
            /** @var \Everest\Models\Subuser $match */
            $match = $route->parameter('server')
                ->subusers()
                ->whereRelation('user', 'uuid', '=', $value)
                ->firstOrFail();

            return $match->user;
        });

        return parent::handle($request, $next);
    }
}
