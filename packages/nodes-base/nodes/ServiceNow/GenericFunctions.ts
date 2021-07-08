import {
	OptionsWithUri
} from 'request';

import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
} from 'n8n-core';

import {
	IDataObject,
	NodeApiError,
} from 'n8n-workflow';

export async function serviceNowApiRequest(this:  IExecuteFunctions | ILoadOptionsFunctions, method: string, resource: string, body: any = {}, qs: IDataObject = {}, uri?: string, option: IDataObject = {}): Promise<any> { // tslint:disable-line:no-any

	const credentials = this.getCredentials('serviceNowOAuth2Api');

	const options: OptionsWithUri = {
		headers: {},
		method,
		qs,
		body,
		uri: uri || `https://${credentials?.subdomain}.service-now.com/api${resource}`,
		json: true,
	};
	if (!Object.keys(body).length) {
		delete options.body;
	}

	if (Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	if (options.qs.limit) {
		delete options.qs.limit;
	}

	try {

		return await this.helpers.requestOAuth2!.call(this, 'serviceNowOAuth2Api', options);

	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
}

export async function serviceNowRequestAllItems(this: IExecuteFunctions | ILoadOptionsFunctions, method: string, resource: string, body: any = {}, query: IDataObject = {}): Promise<any> { // tslint:disable-line:no-any

	const returnData: IDataObject[] = [];
	let responseData;

	const page = 100;

	query.sysparm_limit = page;

	responseData = await serviceNowApiRequest.call(this, method, resource, body, query, undefined, { resolveWithFullResponse: true });
	returnData.push.apply(returnData, responseData.body.result);

	const quantity = responseData.headers['x-total-count'];
	const iterations = Math.round(quantity/page) + (quantity%page? 1:0);

	for( let iteration = 1; iteration < iterations; iteration++ ){

		query.sysparm_limit = page;
		query.sysparm_offset = iteration*page;
		responseData = await serviceNowApiRequest.call(this, method, resource, body, query, undefined, { resolveWithFullResponse: true });

		returnData.push.apply(returnData, responseData.body.result);

	}

	return returnData;
}


export const mapEndpoint = (resource: string, operation: string) => {
	const resourceEndpoint = new Map([
		['tableRecord','sys_dictionary'],
		['businessService','cmdb_ci_service'],
		['configurationItems','cmdb_ci'],
		['department','cmn_department'],
		['dictionary','sys_dictionary'],
		['incident','incident'],
		['user','sys_user'],
	]);
	const operationEndpoint = new Map([
		['getUserGroups','sys_user_group'],
		['getUserRoles','sys_user_role'],
	]);
	if (resource === 'user') {
		if (operationEndpoint.has(operation)) {
			return operationEndpoint.get(operation);
		}
	}
	return resourceEndpoint.get(resource);
};