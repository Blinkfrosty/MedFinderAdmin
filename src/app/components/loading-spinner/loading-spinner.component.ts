import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';
import { Observable } from 'rxjs';

/**
 * Component responsible for displaying a loading spinner based on the application's loading state.
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent {

  /**
   * Observable that emits the current loading state.
   * @type {Observable<boolean>}
   */
  isLoading$: Observable<boolean>;

  /**
   * Creates an instance of LoadingSpinnerComponent.
   * 
   * @param loadingService Service that manages the loading state of the application.
   */
  constructor(private loadingService: LoadingService) {
    this.isLoading$ = this.loadingService.loading$;
  }
}
