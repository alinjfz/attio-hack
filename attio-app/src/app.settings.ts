import type {SettingsSchema} from "attio"

/**
 * @see https://docs.attio.com/sdk/guides/adding-workspace-settings
 */
export const settingsSchema = {
    workspace: {},
} satisfies SettingsSchema

export default settingsSchema
