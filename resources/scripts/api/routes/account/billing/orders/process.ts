import { Server } from '@definitions/server';
import http from '@/api/http';
import { BillingServerVariables } from '@/components/account/billing/order/PaymentButton';

export interface CreateOrderTicketResponse {
    order_id: number;
    ticket_id: number;
}

export const createOrderTicket = (
    product_id: number,
    node_id?: number,
    variables?: BillingServerVariables[],
    discount_code?: string,
    egg_id?: number,
    server_id?: number,
): Promise<CreateOrderTicketResponse> => {
    return new Promise((resolve, reject) => {
        http.get('/sanctum/csrf-cookie')
            .then(() =>
                http.post('/api/client/billing/order-tickets', {
                    node_id,
                    server_id,
                    product_id,
                    variables,
                    discount_code,
                    egg_id,
                }),
            )
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};

export const processFreeCheckoutSession = (
    product_id: number,
    node_id?: number,
    variables?: { key: string; value: string }[],
    server_id?: number,
    egg_id?: number,
): Promise<Server> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/billing/free/process`, { server_id, node_id, product_id, variables, egg_id })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};
