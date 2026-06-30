import { Injectable } from "@nestjs/common";
import Exa from "exa-js";
import { ExaSearchType } from "../ai/tools-schemas/web-search.schema";

@Injectable()
export class ExaService {
    protected exa: Exa;

    constructor() {
        const key = process.env.EXA_API_KEY;
        if (!key) {
            throw new Error("no exa key");
        }

        this.exa = new Exa(key);
    }

    async search(data: ExaSearchType) {
        return this.exa.search(data.query, {
            type: "auto",
            numResults: data.numResults ?? 10,
            startPublishedDate: new Date(Date.now() - data.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
            contents: { highlights: true }
        });
    }
}
