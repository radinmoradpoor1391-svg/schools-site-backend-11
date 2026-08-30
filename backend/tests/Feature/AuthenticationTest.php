<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_with_correct_credentials(): void
    {
        $admin = User::create([
            'username' => 'admin',
            'national_id' => '3333333333',
            'password' => Hash::make('1234'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'admin',
            'password' => '1234',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'username', 'role'],
            ]);
    }

    public function test_login_fails_with_incorrect_password(): void
    {
        User::create([
            'username' => 'admin',
            'national_id' => '3333333333',
            'password' => Hash::make('1234'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'admin',
            'password' => 'wrong-pass',
        ]);

        $response->assertStatus(401)
            ->assertJson(['success' => false]);
    }

    public function test_inactive_user_cannot_login(): void
    {
        User::create([
            'username' => 'blocked_user',
            'national_id' => '1111111111',
            'password' => Hash::make('1234'),
            'role' => 'student',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'blocked_user',
            'password' => '1234',
        ]);

        $response->assertStatus(403);
    }
}
