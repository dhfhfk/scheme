/// <reference types="node" />
import { Agent } from "https";
export declare const defaultAgent: Agent;
export default function fetchHcs(path?: string, method?: string, data?: {}, endpoint?: string, token?: string): Promise<any>;
