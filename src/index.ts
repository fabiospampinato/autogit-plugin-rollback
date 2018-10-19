
/* IMPORT */

import * as _ from 'lodash';
import * as input from 'listr-input';
import * as minimist from 'minimist';
import * as simpleGit from 'simple-git/promise';
import parseMessage from './parse_message';

const argv = minimist ( process.argv.slice ( 2 ) );

/* ROLLBACK */

//TODO: Inquirer should be forked, it should put the `?` character at the last line, not the first one

const defaultOptions = {
  remote: 'origin',
  rollback: {
    workingTree: true,
    history: true
  },
  force: !![argv.force, false].find ( _.isBoolean )
};

function factory ( customOptions?: Partial<typeof defaultOptions> ) {

  const options = _.merge ( {}, defaultOptions, customOptions );

  return async function rollback ( config, repoPath, ctx, task ) {

    /* ACTIONS */

    const actions: Function[] = [],
          confirmations: string[] = [];

    async function rollbackHistory ( hash ) {

      const hash7 = hash.slice ( -7 );

      task.output = `Rolling back history to "${hash7}"...`;

      await git.reset ([ '--hard', hash ]);

      task.output = `History rolled back to "${hash7}"`;

    }

    async function rollbackWorkingTree () {

      task.output = 'Rolling back working tree...';

      await git.reset ( 'hard' );

      task.output = 'Working tree rolled back';

    }

    async function runActions () {

      for ( let action of actions ) {

        await action ();

      }

      task.output = 'Rollback performed';

    }

    /* INIT */

    const git = simpleGit ( repoPath );

    if ( options.rollback.history ) {

      const remotes = await git.getRemotes ( true ),
            remote = remotes.find ( remote => remote.name === options.remote ),
            branch = ( await git.branchLocal () ).current;

      if ( !remote || !branch ) {

        task.output = `Remote "${options.remote}/${branch}" not found`;

      } else {

        task.output = `Fetching from "${options.remote}/${branch}"...`;

        await git.fetch ( options.remote, branch );

        const localLog = await git.log ({ '--max-count': '100' }),
              remoteLog = await git.log ({ [`${options.remote}/${branch}`]: null, '--max-count': '1' });

        if ( !localLog.all.length ) {

          task.output = 'No commits found locally';

        } else if ( !remoteLog.all.length ) {

          task.output = `No commits found in "${options.remote}/${branch}"`;

        } else {

          const remoteCommit = remoteLog.all[0],
                removeCommits = localLog.all.slice ( 0, localLog.all.findIndex ( commit => commit.hash === remoteCommit.hash ) );

          if ( !removeCommits.length ) {

            task.output = 'No commits to roll back';

          } else {

            actions.push ( () => rollbackHistory ( remoteCommit.hash ) );
            confirmations.push ( `Rolling back ${removeCommits.length} commits:\n${removeCommits.map ( commit => `  ${parseMessage ( commit.message )}` ).join ( '\n' )}` );

          }

        }

      }

    }

    if ( options.rollback.workingTree ) {

      const status = await git.status (),
            files = _.concat ( status.not_added, status.conflicted, status.created, status.deleted, status.modified, status.renamed );

      if ( !files.length ) {

        task.output = 'No dirty files found in the working tree';

      } else {

        actions.push ( rollbackWorkingTree );
        confirmations.push ( `Rolling back ${files.length} files:\n${files.map ( file => `  ${file}` ).join ( '\n' )}` );

      }

    }

    /* CONFIRMATION */

    if ( !confirmations.length ) return task.skip ( 'Nothing to roll back' );

    if ( config.dry ) return task.skip ( confirmations.join ( '\n' ) );

    if ( !options.force ) {

      confirmations.push ( 'Press enter to confirm:' );

      return input ( confirmations.join ( '\n' ), { done: runActions } );

    } else {

      return await runActions ();

    }

  };

}

/* EXPORT */

export = Object.assign ( factory, { default: factory } );
