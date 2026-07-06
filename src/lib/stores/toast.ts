import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	type: ToastType;
	title: string;
	message?: string;
	duration?: number;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function add(toast: Omit<Toast, 'id'>) {
		const id = crypto.randomUUID();
		const duration = toast.duration ?? 4500;

		update((toasts) => [{ ...toast, id }, ...toasts]);

		if (duration > 0) {
			setTimeout(() => remove(id), duration);
		}

		return id;
	}

	function remove(id: string) {
		update((toasts) => toasts.filter((t) => t.id !== id));
	}

	return {
		subscribe,
		success: (title: string, message?: string) => add({ type: 'success', title, message }),
		error:   (title: string, message?: string) => add({ type: 'error',   title, message }),
		warning: (title: string, message?: string) => add({ type: 'warning', title, message }),
		info:    (title: string, message?: string) => add({ type: 'info',    title, message }),
		remove
	};
}

export const toast = createToastStore();
