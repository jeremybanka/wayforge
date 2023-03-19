import { z } from "zod";

export default z
  .object({
    id: z.string().describe("The unique identifier of the card."),
    artwork: z.string().describe("The URL of the card's artwork."),
    contentId: z
      .string()
      .describe("The unique identifier of the card's content."),
    setId: z
      .array(z.any())
      .describe("The unique identifier of the card's set."),
  })
  .describe("A card in the game of Wayfarer.");
