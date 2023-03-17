export const toggleBetween =
  <T>(option1: T, option2: T) =>
  (subject: T): T =>
    subject === option1 ? option2 : option1
