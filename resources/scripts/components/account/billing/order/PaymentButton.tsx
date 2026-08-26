import OrderConfirmationButton from './OrderConfirmationButton';
import { Product } from '@definitions/account/billing';

export interface BillingServerVariables {
    key: string;
    value: string;
}

interface Props {
    node: number;
    product: Product;
    vars: Map<string, string>;
    discount_code?: string | undefined;
    egg?: number;
}

export default (data: Props) => <OrderConfirmationButton {...data} />;
