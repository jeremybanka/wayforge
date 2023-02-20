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
    timeUnit: z
      .enum(["ms", "s", "m", "h", "d", "w", "mo", "yr"])
      .describe("The units of time that this reaction takes to complete.")
      .optional(),
  })
  .describe("An elemental reaction in the game of Wayfarer.");
