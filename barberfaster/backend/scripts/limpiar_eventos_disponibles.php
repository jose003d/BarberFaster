<?php
require_once __DIR__ . '/../config/database.php';

$sqlCount = "
    SELECT COUNT(*) AS total
    FROM eventos e
    WHERE e.disponible = 1
      AND e.start_datetime >= NOW()
      AND e.id_evento NOT IN (
          SELECT c.id_evento
          FROM citas c
          WHERE c.id_evento IS NOT NULL
      )
";

$stmt = $pdo->query($sqlCount);
$total = (int)$stmt->fetchColumn();

if ($total === 0) {
    echo "No hay filas a borrar.\n";
    exit(0);
}

echo "DELETE que se ejecutaría:\n";
echo "DELETE e FROM eventos e\n";
echo "WHERE e.disponible = 1\n";
echo "  AND e.start_datetime >= NOW()\n";
echo "  AND e.id_evento NOT IN (\n";
echo "      SELECT c.id_evento FROM citas c WHERE c.id_evento IS NOT NULL\n";
echo "  );\n\n";
echo "SELECT COUNT(*) previa: {$total}\n\n";

echo "¿Deseas ejecutar el DELETE? Escribe 'SI' para confirmarlo: ";
$confirm = trim((string)fgets(STDIN));

if (strtoupper($confirm) !== 'SI') {
    echo "Operación cancelada. No se borró nada.\n";
    exit(0);
}

$sqlDelete = "
    DELETE e
    FROM eventos e
    WHERE e.disponible = 1
      AND e.start_datetime >= NOW()
      AND e.id_evento NOT IN (
          SELECT c.id_evento
          FROM citas c
          WHERE c.id_evento IS NOT NULL
      )
";

$pdo->exec($sqlDelete);
$affected = $pdo->query("SELECT ROW_COUNT() AS affected")->fetchColumn();

echo "Filas eliminadas: {$affected}\n";
