// Single shared SVG <defs> rendered once in the document.
// All star instances reference #star-grad instead of carrying
// their own duplicate gradient + filter definitions.
export default function StarDefs() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: "fixed", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <linearGradient id="star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cb30ae" />
          <stop offset="100%" stopColor="#5634b9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
