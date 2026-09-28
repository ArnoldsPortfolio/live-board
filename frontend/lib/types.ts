export type BoardSummary = { id: string; title: string; sequence: number };
export type Column = { id: string; title: string; position: number };
export type Card = { id: string; title: string; column_id: string; position: number };
export type BoardDetail = BoardSummary & { columns: Column[]; cards: Card[] };
export type Viewer = { user_id: string; email: string };
