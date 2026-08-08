/**
 * Wraps page content in the shared `page-animate` enter animation (defined in
 * globals.css). The (staff) layout applies the class inline on its main scroll
 * area; this component is available for any route that wants the animation on a
 * narrower subtree.
 */
export default function PageAnimationWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="page-animate">{children}</div>;
}
