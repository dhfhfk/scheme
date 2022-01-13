/// <reference types="node" />
import { Agent } from "https";
export declare const defaultAgent: Agent;
declare function request(path?: string, method?: string, data?: {}, endpoint?: string, token?: string): Promise<any>;
export default request;
