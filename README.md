# With this Telegram bot you can add your financial details to receive useful information about your monthly and yearly financial health.

### *** Currently in development ***

[You can add the bot to Telegram from this link](https://t.me/artcc_myfinancesbot)

<p><strong>Commands in Spanish language to use the bot:</p></strong>

<p>acciones - Elige una de las opciones para recibir información</p>
<p>borrar - Elimino todos tus datos. No podrás recuperarlos</p>
<p>donar - Puedes apoyar económicamente el proyecto. ¡Gracias!</p>
<p>ingresos - Añade o actualiza tus ingresos totales. Ej: /ingresos 1550.50</p>
<p>start - Te muestro información básica sobre mi funcionamiento</p>
<p>suscripcion - Añade una suscripción que tengas contratada. Ej: /suscripcion netflix 17.99 mensual 01/01/2021</p>

### Database in Heroku Postgres:

```
CREATE TABLE SUBSCRIPTIONS(
   ID SERIAL PRIMARY KEY NOT NULL,
   USER_ID INT NOT NULL,
   NAME TEXT NOT NULL,
   PRICE REAL NOT NULL,
   TYPE TEXT NOT NULL,
   DATE TEXT NOT NULL
);
```

```
CREATE TABLE USERS(
   ID INT PRIMARY KEY NOT NULL,
   NAME TEXT NOT NULL,
   REVENUE REAL NOT NULL,
   CREATED_AT BIGINT NOT NULL
);
```

## LICENSE

This project is free and use <b>MIT license</b>.

## THANK YOU!

I hope you like it!

##### ArtCC 2021++