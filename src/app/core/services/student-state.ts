import { Injectable, signal } from '@angular/core';
import { Session } from '../models/session.model';

@Injectable({
  providedIn: 'root'
})
export class StudentStateService {
  selectedSession = signal<Session | null>(null);
}
