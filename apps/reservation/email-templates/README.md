# Templates d'emails Orizon Reservations

Ce dossier contient les templates d'emails personnalisés pour l'application Orizon Reservations, avec les couleurs de la marque (orange #ff6b00 et noir).

## Templates disponibles

1. **confirm-signup.html** - Confirmation d'inscription
2. **reset-password.html** - Réinitialisation de mot de passe
3. **email-change.html** - Changement d'adresse email
4. **magic-link.html** - Connexion par lien magique

## Configuration dans Supabase

Pour configurer ces templates dans votre projet Supabase :

### Étape 1 : Accéder aux paramètres email

1. Allez sur https://supabase.com/dashboard/project/ukdteclknzhbgizrqnbh
2. Cliquez sur **Authentication** dans le menu de gauche
3. Cliquez sur **Email Templates**

### Étape 2 : Configurer chaque template

Pour chaque template, suivez ces étapes :

#### 1. Confirmation d'email (Confirm Signup)

- Sélectionnez **"Confirm signup"** dans la liste
- Copiez le contenu de `confirm-signup.html`
- Collez-le dans l'éditeur Supabase
- **Important** : Supabase utilise la variable `{{ .ConfirmationURL }}` - ne la modifiez pas
- Cliquez sur **Save**

#### 2. Réinitialisation de mot de passe (Reset Password)

- Sélectionnez **"Reset password"** dans la liste
- Copiez le contenu de `reset-password.html`
- Collez-le dans l'éditeur Supabase
- La variable `{{ .ConfirmationURL }}` sera automatiquement remplacée par Supabase
- Cliquez sur **Save**

#### 3. Changement d'email (Change Email)

- Sélectionnez **"Change email address"** dans la liste
- Copiez le contenu de `email-change.html`
- Collez-le dans l'éditeur Supabase
- La variable `{{ .ConfirmationURL }}` sera automatiquement remplacée par Supabase
- Cliquez sur **Save**

#### 4. Magic Link (Connexion sans mot de passe)

- Sélectionnez **"Magic Link"** dans la liste
- Copiez le contenu de `magic-link.html`
- Collez-le dans l'éditeur Supabase
- La variable `{{ .ConfirmationURL }}` sera automatiquement remplacée par Supabase
- Cliquez sur **Save**

### Étape 3 : Configurer l'expéditeur

1. Dans **Settings** > **Authentication** > **SMTP Settings**
2. Vérifiez que Resend est configuré ou configurez-le :
   - **Sender name** : `Orizon Reservations`
   - **Sender email** : `noreply@orizonsapp.com`

### Étape 4 : Tester les emails

Pour tester chaque template :

1. Allez dans **Email Templates**
2. Cliquez sur **"Send test email"** pour chaque template
3. Entrez votre adresse email de test
4. Vérifiez que l'email est bien reçu avec le bon design

## Variables Supabase disponibles

Supabase fournit automatiquement ces variables dans les templates :

- `{{ .ConfirmationURL }}` - URL de confirmation/action
- `{{ .Token }}` - Token de confirmation (si nécessaire)
- `{{ .TokenHash }}` - Hash du token
- `{{ .SiteURL }}` - URL de votre site
- `{{ .Email }}` - Email de l'utilisateur

## Design et couleurs

Les templates utilisent les couleurs de la marque Orizon Reservations :

- **Orange principal** : `#ff6b00`
- **Orange clair** : `#ff8533`
- **Noir principal** : `#0a0a0a`
- **Gris foncé** : `#1a1a1a`
- **Bordures** : `#333`
- **Texte clair** : `#e5e5e5`
- **Texte gris** : `#ccc`

## Notes importantes

- Les templates sont responsive et s'adaptent aux mobiles
- Les boutons CTA ont un gradient orange pour attirer l'attention
- Un lien alternatif est fourni si le bouton ne fonctionne pas
- Les messages de sécurité sont mis en évidence avec une bordure orange
- Le footer inclut les mentions légales et copyright

## Mise à jour des templates

Si vous modifiez les couleurs ou le design du site, pensez à mettre à jour ces templates pour maintenir la cohérence de la marque.
