type SheepGreetingBarProps = {
  title: string;
  greeting: string;
};

export function SheepGreetingBar({ title, greeting }: SheepGreetingBarProps) {
  return (
    <article className="card sheep-greeting-card">
      <p className="sheep-title">{title}</p>
      <p className="sheep-greeting">{greeting}</p>
    </article>
  );
}
