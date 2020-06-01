import { AuthGuard } from './_guards/auth.guard';
import { MembersListComponent } from './members/members-list/members-list.component';
import { MessagesComponent } from './messages/messages.component';
import { HomeComponent } from './home/home.component';
import { Routes } from '@angular/router';
import { ListsComponent } from './lists/lists.component';
import { MemberDetailComponent } from './members/member-detail/member-detail.component';
import { MemberDetailResolver } from './_resolvers/memberdetail.resolver';
import { MemberListResolver } from './_resolvers/member-list.resolver';
import { MemberEditComponent } from './members/member-edit/member-edit.component';
import { MemberEditResolver } from './_resolvers/member-edit.resolver';
import { PreventUnsavedChanges } from './_guards/prevent-unsaved-changes.guard';
import { OpenLayersMapComponent } from './OpenLayersMap/OpenLayersMap.component';

export const appRoutes: Routes = [
    { path: 'home', component: HomeComponent },
    {
        path: '', runGuardsAndResolvers: 'always', canActivate: [AuthGuard],
        children: [
            { path: 'members', component: MembersListComponent, resolve: {users: MemberListResolver}, canActivate: [AuthGuard] },
            { path: 'members/:id', component: MemberDetailComponent, resolve: {user: MemberDetailResolver}, canActivate: [AuthGuard] },
            { path: 'member/edit', component: MemberEditComponent, resolve: {user: MemberEditResolver},
            canDeactivate: [PreventUnsavedChanges] },
            { path: 'maps', component: OpenLayersMapComponent },
            { path: 'messages', component: MessagesComponent },
            { path: 'lists', component: ListsComponent },
        ]
    },
    { path: '**', redirectTo: 'home', pathMatch: 'full' },
];
