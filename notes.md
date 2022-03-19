What you need to do now that we have customizable capabilities is verify your UCAN in terms of some custom capability semantics.

what you essentially want to check is whether the given UCAN authorizes for some capability.


`capabilities` is an array of resources and permission level formatted as:

`capabilities: Array<Capability>`

```js
// Capability:
{
  $TYPE: $IDENTIFIER,
  "cap": $CAPABILITY
}
```
