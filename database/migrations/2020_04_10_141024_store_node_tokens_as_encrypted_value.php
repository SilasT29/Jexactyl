<?php

use Ramsey\Uuid\Uuid;
use Illuminate\Support\Facades\DB;
use Illuminate\Container\Container;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Contracts\Encryption\Encrypter;

class StoreNodeTokensAsEncryptedValue extends Migration
{
    /**
     * Run the migrations.
     *
     * @throws Exception
     */
    public function up(): void
    {
        // Fork-fix: auf frischen Installationen heißt die Spalte bereits daemon_token
        // (2016_01_23_200648_add_nodes wurde im Fork angepasst) — nur dann droppen/rename,
        // wenn das Legacy-Feld daemonSecret überhaupt existiert.
        Schema::table('nodes', function (Blueprint $table) {
            if (Schema::hasColumn('nodes', 'daemonSecret')) {
                $table->dropUnique(['daemonSecret']);
            }
        });

        Schema::table('nodes', function (Blueprint $table) {
            if (!Schema::hasColumn('nodes', 'uuid')) {
                $table->char('uuid', 36)->after('id');
            }
            if (!Schema::hasColumn('nodes', 'daemon_token_id')) {
                $table->char('daemon_token_id', 16)->after('upload_size');
            }

            if (Schema::hasColumn('nodes', 'daemonSecret')) {
                $table->renameColumn('daemonSecret', 'daemon_token');
            }
        });

        Schema::table('nodes', function (Blueprint $table) {
            $table->text('daemon_token')->change();
        });

        /** @var Encrypter $encrypter */
        $encrypter = Container::getInstance()->make(Encrypter::class);

        foreach (DB::select('SELECT id, daemon_token FROM nodes') as $datum) {
            DB::update('UPDATE nodes SET uuid = ?, daemon_token_id = ?, daemon_token = ? WHERE id = ?', [
                Uuid::uuid4()->toString(),
                str_random(16),
                $encrypter->encrypt($datum->daemon_token),
                $datum->id,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Intentionally left empty — reversing this migration is not supported.
    }
}