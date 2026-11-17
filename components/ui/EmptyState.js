import { Info } from "lucide-react";
import { Card } from "./Card.js";

export function EmptyState({ icon: Icon = Info, title, description, action }) {
  return (
    <Card className="flex flex-col items-center gap-2 py-12 text-center">
      <div className="grid size-11 place-items-center rounded-full bg-sunken text-muted">
        <Icon aria-hidden="true" size={24} />
      </div>
      <h2 className="m-0 mt-1 text-xl font-semibold tracking-tight text-fg">{title}</h2>
      {description ? <p className="m-0 max-w-[46ch] text-sm text-fg-2">{description}</p> : null}
      {action ? <div className="mt-3 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </Card>
  );
}
