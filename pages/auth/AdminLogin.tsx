import React from 'react';
import { LoginComponent } from './LoginComponent';
import { Role } from '../../types';

export default function AdminLogin() {
  return <LoginComponent title="Admin Portal" role={Role.ADMIN} redirectPath="/admin/dashboard" />;
}
