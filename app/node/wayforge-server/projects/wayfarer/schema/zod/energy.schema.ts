import { z } from "zod";

export default z
  .object({
    id: z.string().describe("The unique identifier of the energy."),
    name: z.string().describe("The unique name of this energy."),
    color: z.string().describe("The unique identifier of the card's content."),
    icon: z.string().describe("The URL of the card's artwork."),
  })
  .describe("A card in the game of Wayfarer.");
