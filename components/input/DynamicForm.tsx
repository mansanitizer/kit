import { TextInput } from "./TextInput"
import { TextArea } from "./TextArea"
import { ImageUpload } from "./ImageUpload"
import { Checkbox } from "@/components/ui/Checkbox"
import { Slider } from "@/components/ui/Slider"
import { RadioGroup } from "@/components/ui/RadioGroup"
import { MultiSelect } from "@/components/ui/MultiSelect"
import { cn } from "@/lib/utils"

interface DynamicFormProps {
    schema: Record<string, any>
    value: Record<string, any>
    onChange: (newValue: Record<string, any>) => void
    disabled?: boolean
}

export function DynamicForm({ schema, value, onChange, disabled }: DynamicFormProps) {
    if (!schema || !schema.properties) return null;

    const properties = schema.properties;
    const required = schema.required || [];

    const handleChange = (key: string, val: any) => {
        onChange({ ...value, [key]: val });
    }

    return (
        <div className="space-y-8">
            {Object.keys(properties).map((key) => {
                const field = properties[key];
                const isRequired = required.includes(key);
                const currentValue = value[key];
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                // 1. Image Upload
                if (key === 'image' || (field.type === 'string' && field.format === 'data-url')) {
                    return (
                        <div key={key}>
                            <ImageUpload
                                label={label}
                                onUpload={(file) => {
                                    const reader = new FileReader()
                                    reader.onloadend = () => handleChange(key, reader.result)
                                    reader.readAsDataURL(file)
                                }}
                            />
                        </div>
                    )
                }

                // 2. Boolean -> Checkbox or Switch
                if (field.type === 'boolean') {
                    return (
                        <div key={key}>
                            <Checkbox
                                label={field.description || label}
                                checked={!!currentValue}
                                onChange={(e) => handleChange(key, e.target.checked)}
                                disabled={disabled}
                            />
                        </div>
                    )
                }

                // 3. Integer with Range -> Slider
                if (field.type === 'integer' && (field.minimum !== undefined && field.maximum !== undefined)) {
                    return (
                        <div key={key}>
                            <Slider
                                label={label}
                                min={field.minimum}
                                max={field.maximum}
                                value={currentValue ?? field.minimum} // Default to min
                                onChange={(val) => handleChange(key, val)}
                                disabled={disabled}
                                unit={field.unit}
                            />
                            {field.description && (
                                <p className="text-xs text-white/40 mt-1">{field.description}</p>
                            )}
                        </div>
                    )
                }

                // 4. Array of Enums -> MultiSelect
                if (field.type === 'array' && field.items?.enum) {
                    return (
                        <div key={key}>
                            <MultiSelect
                                label={label}
                                options={field.items.enum}
                                value={currentValue || []}
                                onChange={(val) => handleChange(key, val)}
                                disabled={disabled}
                            />
                            {field.description && (
                                <p className="text-xs text-white/40 mt-1">{field.description}</p>
                            )}
                        </div>
                    )
                }

                // 5. Enum (Small) -> Radio Group
                if (field.enum && field.enum.length <= 4) {
                    return (
                        <div key={key}>
                            <RadioGroup
                                label={label}
                                options={field.enum}
                                value={currentValue || ""}
                                onChange={(val) => handleChange(key, val)}
                                disabled={disabled}
                                orientation="horizontal" // Default to horizontal for small counts
                            />
                        </div>
                    )
                }

                // 6. Enum (Large) -> Select (Native for now, or styled Radio List)
                if (field.enum) {
                    // For larger enums, maybe vertical radio list or dropdown. 
                    // Using Vertical Radio for 5-10, Drodown for 10+.
                    // For generic "simple" UI, let's stick to RadioGroup Vertical for mapped clarity.
                    return (
                        <div key={key}>
                            <RadioGroup
                                label={label}
                                options={field.enum}
                                value={currentValue || ""}
                                onChange={(val) => handleChange(key, val)}
                                disabled={disabled}
                                orientation="vertical"
                            />
                        </div>
                    )
                }

                // 7. Long Text -> TextArea
                if (field.type === 'string' && (field.maxLength > 100 || key === 'context' || key.includes('text') || key === 'cv_text' || field.description?.includes('long'))) {
                    return (
                        <TextArea
                            key={key}
                            label={label}
                            placeholder={field.description || `Enter ${label}...`}
                            value={currentValue || ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                            disabled={disabled}
                            rows={key === 'cv_text' ? 10 : 4}
                        />
                    )
                }

                // 8. Default -> TextInput
                return (
                    <TextInput
                        key={key}
                        label={label}
                        placeholder={field.description || `Enter ${label}...`}
                        value={currentValue || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        disabled={disabled}
                        type={field.type === 'integer' || field.type === 'number' ? 'number' : 'text'}
                    />
                )
            })}
        </div>
    )
}
