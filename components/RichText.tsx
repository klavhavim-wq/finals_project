/** Renders trusted localized rich text (contains <br>, <strong>, inline styles). */
export default function RichText({
  html,
  as: Tag = "div",
  className,
  style,
}: {
  html: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
}) {
  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
