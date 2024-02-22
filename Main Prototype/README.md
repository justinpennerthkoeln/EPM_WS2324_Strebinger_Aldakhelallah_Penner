# Main Prototype

## Installationsanleitung

Zunächst muss sichergestellt werden, dass `Docker` und `Node.js` installiert sind. `Node.js` muss dabei die Version 20 oder höher haben. 
Anschließend muss eine `.env`-File angelegt werden, die die Informationen, wie sie in der `.env.example` beschrieben sind, enthält.

### Datenbank aufsetzen

Der folgende Befehl muss innerhalb des Verzeichnisses ausgeführt werden.

```terminal
docker-compose up -d --build
```

### Node.js starten

Zunächst müssen alle Packages installiert werden.

```terminal
npm i
```

Anschließend kann die Plattform gestartet werden.

```terminal
npm run dev
```

Wichtig ist, dass die Datenbank parallel zur Plattform läuft, da sonst Fehler auftreten.
