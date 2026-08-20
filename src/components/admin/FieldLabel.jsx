export default function FieldLabel({ htmlFor, children, required = false }) {
  return (
    <label htmlFor={htmlFor}>
      {children}
      {required ? (
        <span className="field-required" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  )
}
