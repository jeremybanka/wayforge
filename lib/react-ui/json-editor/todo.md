
- [x] add an ErrorBoundary to the Components prop
  - [x] wrap each JsonEditor_INTERNAL in an ErrorBoundary
- [ ] add display components that visualize data
  - simply pass in a JSON object as the type required, if it hits an error, just catch a boundary and display the error
- [ ] add display of miscast properties with button to fix
  - [ ] fixing a miscast generates a template from the schema
- [ ] sort official properties as listed in schema
- [ ] add extra line break in JSON before unofficial properties