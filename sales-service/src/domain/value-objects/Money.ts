export class Money {
readonly amount: number; // cents
constructor(amount: number) {
if (!Number.isFinite(amount) || isNaN(amount)) throw new Error('Invalid amount');
this.amount = Math.round(amount);
}
add(other: Money) { return new Money(this.amount + other.amount); }
subtract(other: Money) { return new Money(this.amount - other.amount); }
}