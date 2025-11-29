export interface CheckoutDTO {
    branchId: string;
    cashierId: string;
    items: { productId: string; quantity: number; price: number }[]
}

export interface ConfirmSaleDTO {
    checkoutSummary: any; // returned from checkout
    paymentMode: "CASH" | "CARD" | "UPI";
}