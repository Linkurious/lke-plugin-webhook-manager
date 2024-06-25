import { Url } from "url";

export type Datasource = {
  key: string;
  name: string;
}

export type Webhook = {
  id: number;
  url: string;
  events: Array<{
    eventType: string;
    sourceKey?: string;
  }>;
  createdAt: string;
  updatedAt: string;
};
