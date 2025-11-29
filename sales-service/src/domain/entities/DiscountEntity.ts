export type DiscountType = "BUY_X_GET_Y"
    | "PRODUCT_FLAT"
    | "PRODUCT_PERCENTAGE"
    | "CART_FLAT"
    | "CART_PERCENTAGE";

export interface DiscountEntity {
    id?: string;
    name: string; //discount name
    type: DiscountType
    // product-level
    productId?: string;
    // category?: string;
    // minQty?: number; //for product discounts
    //buy-get
    buyQty?: number;
    getQty?: number;//free
    // flat/percentage
    flatAmount?: number; // per-unit for product flat; absolute for cart flat
    percentage?: number;
    // cart-level
    minPurchaseAmount?: number;
    // meta
    isActive: boolean;
    startDate: Date;
    endDate: Date;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;


}