import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext } from './app-form-context'
import { AppTextField, AppSubmitButton } from './app-form-components'

export const { useAppForm } = createFormHook({
	fieldComponents: {
		TextField: AppTextField,
	},
	formComponents: {
		SubmitButton: AppSubmitButton,
	},
	fieldContext,
	formContext,
})
