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

    // Sort properties: Images/Important fields first
    const sortedKeys = Object.keys(properties).sort((a, b) => {
        const aOrder = a === 'image' ? -1 : 0;
        const bOrder = b === 'image' ? -1 : 0;
        return aOrder - bOrder;
    });

    return (
        <div className="space-y-8">
            {sortedKeys.map((key) => {
                const field = properties[key];
                const isRequired = required.includes(key);
                const currentValue = value[key];
                const label = field.title || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                // Component Selection
                const componentView = (() => {
                    // 1. Image Upload
                    if (key === 'image' || (field.type === 'string' && field.format === 'data-url')) {
                        return (
                            <ImageUpload
                                label={label}
                                onUpload={(file) => {
                                    const reader = new FileReader()
                                    reader.onloadend = () => handleChange(key, reader.result)
                                    reader.readAsDataURL(file)
                                }}
                            />
                        )
                    }

                    // 2. Boolean -> Checkbox
                    if (field.type === 'boolean') {
                        return (
                            <Checkbox
                                label={field.description || label}
                                checked={!!currentValue}
                                onChange={(e) => handleChange(key, e.target.checked)}
                                disabled={disabled}
                            />
                        )
                    }

                    // 3. Integer with Range -> Slider
                    if (field.type === 'integer' && (field.minimum !== undefined && field.maximum !== undefined)) {
                        return (
                            <Slider
                                label={label}
                                min={field.minimum}
                                max={field.maximum}
                                value={currentValue ?? field.minimum}
                                onChange={(val) => handleChange(key, val)}
                                disabled={disabled}
                                unit={field.unit}
                            />
                        )
                    }

                    // 4. Array of Enums -> MultiSelect
                    if (field.type === 'array' && field.items?.enum) {
                        return (
                            <MultiSelect
                                label={label}
                                options={field.items.enum}
                                value={currentValue || []}
                                onChange={(val) => handleChange(key, val)}
                                disabled={disabled}
                            />
                        )
                    }

                    // 5. Enum (Small) -> Radio Group
                    if (field.enum && field.enum.length <= 4) {
                        return (
                            <RadioGroup
                                label={label}
                                options={field.enum}
                                value={currentValue || ""}
                                onChange={(val) => handleChange(key, val)}
                                disabled={disabled}
                                orientation="horizontal"
                            />
                        )
                    }

                    // 6. Enum (Large) -> Radio List
                    if (field.enum) {
                        return (
                            <RadioGroup
                                label={label}
                                options={field.enum}
                                value={currentValue || ""}
                                onChange={(val) => handleChange(key, val)}
                                disabled={disabled}
                                orientation="vertical"
                            />
                        )
                    }

                    // 7. Long Text -> TextArea
                    const isLongText = field.type === 'string' && (
                        field.maxLength > 100 ||
                        ['context', 'description', 'notes', 'text', 'cv_text'].some(k => key.toLowerCase().includes(k)) ||
                        field.description?.toLowerCase().includes('long')
                    );

                    if (isLongText) {
                        return (
                            <TextArea
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
                            label={label}
                            placeholder={field.description || `Enter ${label}...`}
                            value={currentValue || ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                            disabled={disabled}
                            type={field.type === 'integer' || field.type === 'number' ? 'number' : 'text'}
                        />
                    )
                })();

                return (
                    <div key={key} className="space-y-2">
                        <div className="flex items-center gap-2">
                            {isRequired && <span className="text-rose-500 text-xs font-bold leading-none">*</span>}
                            {/* Label is handled by components usually, but we can wrap if needed */}
                        </div>
                        {componentView}
                        {field.description && !['boolean', 'string'].includes(field.type) && (
                            <p className="text-[10px] text-white/30 uppercase tracking-widest pl-1">{field.description}</p>
                        )}
                    </div>
                );
            })}
        </div>
    )
}
