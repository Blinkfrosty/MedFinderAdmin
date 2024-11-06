import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service responsible for managing the loading state across the application.
 * It provides methods to show and hide loading indicators by updating the loading state.
 */
@Injectable({
    providedIn: 'root'
})
export class LoadingService {

    private loadingSubject = new BehaviorSubject<boolean>(false);

    /**
     * Observable that emits the current loading state.
     */
    loading$: Observable<boolean> = this.loadingSubject.asObservable();

    /**
     * Sets the loading state to `true` to indicate that a loading process has started.
     */
    show(): void {
        this.loadingSubject.next(true);
    }

    /**
     * Sets the loading state to `false` to indicate that the loading process has completed.
     */
    hide(): void {
        this.loadingSubject.next(false);
    }
}