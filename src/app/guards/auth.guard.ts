import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes based on user authentication and roles.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    /**
     * Determines whether a route can be activated based on authentication status and user roles.
     * 
     * @param route The current route snapshot.
     * @param state The current router state snapshot.
     * @returns A promise that resolves to `true` if the user is authenticated and has the required role,
     *          otherwise redirects to the login or unauthorized page and resolves to `false`.
     */
    async canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Promise<boolean> {
        const isAuth = await this.authService.isAuthenticated();
        if (!isAuth) {
            this.router.navigate(['/login']);
            return false;
        }

        const requiredRole = route.data['requiredRole'] as string;
        if (requiredRole && !(await this.authService.hasRole(requiredRole))) {
            this.router.navigate(['/unauthorized']);
            return false;
        }

        return true;
    }
}