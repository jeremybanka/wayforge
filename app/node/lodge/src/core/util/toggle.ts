export default
(
  subject:any,
  option1:typeof subject,
  option2:typeof subject
)
: typeof subject =>
  subject === option1 ? option2 : option1
