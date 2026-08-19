import React, { useState, Dispatch, SetStateAction, useEffect } from 'react'
import { Tag, TagInput } from 'emblor'

interface FormTagInputProps {
  value: string
  onChange: (value: string) => void
  separator?: string
  error?: string
	placeholder?: string
}

const FormTagInput = ({
  value,
  onChange,
  separator = '|',
  error,
	placeholder,
}: FormTagInputProps) => {
  const [tags, setTags] = useState<Tag[]>(() =>
    value && typeof value === 'string'
      ? value.split(separator).filter(text => text.trim()).map((text, i) => ({
          id: i.toString(),
          text: text.trim(),
        }))
      : []
  );

  useEffect(() => {
    if (value && typeof value === 'string') {
      const newTags = value.split(separator)
        .filter(text => text.trim())
        .map((text, i) => ({
          id: i.toString(),
          text: text.trim(),
        }));
      setTags(newTags);
    } else {
      setTags([]);
    }
  }, [value, separator]);

  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)

  const handleTagsChange: Dispatch<SetStateAction<Tag[]>> = (
    newTagsOrUpdater
  ) => {
    const newTags =
      typeof newTagsOrUpdater === 'function'
        ? newTagsOrUpdater(tags)
        : newTagsOrUpdater

    setTags(newTags)
    onChange(newTags.map((tag) => tag.text).join(separator))
  }

  return (
		<div>
			<div className="space-y-2">
				<TagInput
					tags={tags}
					setTags={handleTagsChange}
					placeholder={placeholder}
					styleClasses={{
						inlineTagsContainer:
							'bg-ui-bg-field hover:bg-ui-bg-field-hover shadow-borders-base focus-within:shadow-borders-interactive-with-active transition-fg p-1 gap-1 rounded-md',
						input:
							'w-full min-w-[80px] focus-visible:outline-hidden shadow-none px-2 h-7 txt-compact-small text-ui-fg-base',
						tag: {
							body: 'h-7 bg-ui-bg-component shadow-borders-base rounded-md txt-compact-small-plus text-ui-fg-subtle ps-2 pe-7',
							closeButton:
								'text-ui-fg-muted hover:text-ui-fg-subtle transition-fg absolute -inset-y-px -end-px p-0 flex size-7 items-center justify-center rounded-e-md outline-hidden hover:bg-ui-bg-component-hover',
						},
					}}
					activeTagIndex={activeTagIndex}
					setActiveTagIndex={setActiveTagIndex}
				/>
				{error && <p className="txt-small text-ui-fg-error">{error}</p>}
			</div>
		</div>
  )
}

export default FormTagInput
