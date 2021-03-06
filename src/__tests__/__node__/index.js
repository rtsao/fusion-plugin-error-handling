/* eslint-env node */
import test from 'tape-cup';
import ErrorHandling from '../../server';
import {fork} from 'child_process';

test('request errors', async t => {
  let called = 0;
  const onError = () => {
    called++;
  };
  const middleware = ErrorHandling({onError});
  await middleware({}, () => Promise.reject(new Error('server error'))).catch(
    () => {}
  );
  t.equals(called, 1, 'emits server error');

  const ctx = {
    path: '/_errors',
    prefix: '',
    request: {body: {message: 'test'}},
  };
  await middleware(ctx, () => Promise.resolve());
  t.equals(called, 2, 'emits browser error');
  t.end();
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('unhandledRejection');
});

test('Uncaught exceptions', async t => {
  const forked = fork('./fixtures/uncaught-exception.js', {stdio: 'pipe'});
  let stdout = '';
  forked.stdout.on('data', data => {
    stdout += data.toString();
  });

  forked.on('close', code => {
    t.equal(code, 1, 'exits with code 1');
    t.ok(stdout.includes('ERROR HANDLER'));
    t.end();
  });
});

test('Unhandled rejections', async t => {
  const forked = fork('./fixtures/unhandled-rejection.js', {stdio: 'pipe'});
  let stdout = '';
  forked.stdout.on('data', data => {
    stdout += data.toString();
  });
  forked.on('close', code => {
    t.equal(code, 1, 'exits with code 1');
    t.ok(stdout.includes('ERROR HANDLER'));
    t.end();
  });
});
