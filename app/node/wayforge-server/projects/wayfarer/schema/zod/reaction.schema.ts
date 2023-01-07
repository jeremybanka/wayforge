import { z } from "zod";

export default z
  .object({
    id: z.string().describe("The unique identifier of the reaction."),
    name: z.string().describe("The unique name of this reaction."),
    time: z
      .number()
      .describe(
        "The time in whichever timeUnits that this reaction takes to complete."
      ),
    timeUnits: z
      .enum(["seconds", "minutes", "hours", "days", "weeks", "months", "years"])
      .describe("The units of time that this reaction takes to complete."),
    reagents: z
      .array(
        z.object({
          amount: z.number().optional(),
          energyId: z.string().optional(),
        })
      )
      .describe("The inputs to this reaction."),
    products: z
      .array(
        z.object({
          amount: z.number().optional(),
          energyId: z.string().optional(),
        })
      )
      .describe("The outputs from this reaction."),
  })
  .describe("An elemental reaction in the game of Wayfarer.");
