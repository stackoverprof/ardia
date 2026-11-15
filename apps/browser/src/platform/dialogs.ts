import { nativeModule, type ConfirmOptions, type PromptOptions } from "@ardia/shell";

import { brandDeep } from "../lib/brand";

const Dialogs = nativeModule("ArdiaDialogs");

// (fork) shown text says Bro
export const confirm = (options: ConfirmOptions) => Dialogs.confirm(brandDeep(options));
export const prompt = (options: PromptOptions) => Dialogs.prompt(brandDeep(options));
export const pickFiles = () => Dialogs.pickFiles();
export const pickFolder = (current: string | null, prompt: string | null = null) => Dialogs.pickFolder(current, prompt);
