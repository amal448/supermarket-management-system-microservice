import { ISaleRepository } from "../../domain/repositories/ISaleRepository";

export class getSalesSummary {
    constructor(private saleRepo: ISaleRepository) { }
    async execute() {
        return this.saleRepo.getSalesSummary();
    }
}