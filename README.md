# Google Calendar Scheduling Utility

**README Authored by Brian Lee, last revision March 2024**

Apps Script based application for finding and outputing defined time gaps between scheduled events

## Development

The scale and scope of this project (not to mention the limitations around developer time) lead to the decision of not provisioning a separate, isolated development environment.

Because this application uses the source calendar as a read-only input by design, developing against a live, "production" instance of the calendar should not cause mutations on the *source of truth*. This can be further ensured by testing against usage of specific methods of `CalendarApp` class.

The consequence of this setup is the inversion of CI/CD flow; it is often much easier to develop/test features and fixes on the production instance (i.e. the only instance), and then pull down the changes to the repository and commit code changes post facto. The general lack of `git` commits here is a reflection of this.

### Using Clasp

This project uses Apps Script CLI: `clasp`.

[CLI developer guide (codelabs.developers.google.com)](https://codelabs.developers.google.com/codelabs/clasp)

CLI is included as a development dependency; full installation of this repository will provide a local version even without global installation.

You may execute `clasp` commands by using `npm run clasp` and passing commands and arguments with `--`.

eg:
```code:sh
npm run clasp -- help
```

### NPM Scripts

Frequently used CLI commands have been given dedicated NPM scripts. In particular, the scripts have predefined arguments with a local file path for a `.clasprc.json` file: This file is autogenerated in the provided local path when authenticating with `clasp login`

> Because `.clasprc.json` contains plaintext access tokens, it should never be committed into your codebase. The file is specified in `./gitignore` for exclusion from code commits.

- `npm run login`: your terminal will open browser window with a login page. Upon successful authentication, CLI will write over `.clasprc.json` with fresh tokens.
- `npm run pull`: pulls code currently deployed; will overwrite local changes.
- `npm run push`: pushes code to production.

Stale access tokens will cause errors for `pull` and `push` scripts. Reauthenticate with `npm run login` if you experience errors.

## Deployment

You may install this script to your own Google Workspace as follows:

1. Clone this repository locally.
2. Set up your output spreadsheet on Google Sheets:
    - Open [Sheets](https://docs.google.com/spreadsheets/) and create a new spreadsheet
    - Click `Extension` > `Apps Script` on the menu; a new Apps Script project should open
    - Name your project
3. Configure project locally
    - Create the CLI configuration file: `touch .clasp.json`
    - Copy the **script ID**, of the Apps Script project created in step 2, found in `Project Settings` > `IDs` on Apps Script
    - Write the following JSON data to `.clasp.json`:
    ```code:json
    {
        "scriptId": "XXXXXXX", // paste script ID inside double quotes
        "rootDir": "./"
    }
    ```
    > `.gitignore` specifies `.clasp.json` to be excluded from code commits. While not as security sensitive as information in `.clasprc.json`, script IDs are uniquely assigned.
3. Authenticate by running `npm run login` & follow CLI instructions
4. Deploy code by running `npm run push`
5. Configure execution trigger
    - On Apps Script, go to `Triggers` and click the `Add Trigger` button
    - Select the `runCode` function; for trigger conditions of your preference, choose the event source and event type to meet your needs.

## Usage

### Sheet name syntax
The code uses sheet names to supply variables.

```
[calendar name], [starting date], [# of weeks], [(optional) minimum length in minutes]
```

Each sheet is aware of its own name, enabling multiple requests at once.

Malformed names will result in errors.
