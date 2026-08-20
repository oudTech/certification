export default function FieldLabel({ htmlFor, children, optional = false }) {
  return (
    <label htmlFor={htmlFor}>
      <span>{children}</span>
      {optional ? <span className="field-optional">Optional</span> : null}
    </label>
  )
}
