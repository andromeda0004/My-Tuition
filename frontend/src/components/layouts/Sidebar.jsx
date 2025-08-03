import { NavLink } from 'react-router-dom';

// Navigation items array for easier management
const navItems = [
	{
		name: 'Dashboard',
		path: '/',
		icon: (
			<svg
				className="w-5 h-5"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
				/>
			</svg>
		),
	},
	{
		name: 'Students',
		path: '/students',
		icon: (
			<svg
				className="w-5 h-5"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
				/>
			</svg>
		),
	},
	{
		name: 'Attendance',
		path: '/attendance',
		icon: (
			<svg
				className="w-5 h-5"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
				/>
			</svg>
		),
	},
	{
		name: 'Fees',
		path: '/fees',
		icon: (
			<svg
				className="w-5 h-5"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		),
	},
	{
		name: 'Reports',
		path: '/reports',
		icon: (
			<svg
				className="w-5 h-5"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
		),
	},
	{
		name: 'WhatsApp',
		path: '/whatsapp',
		icon: (
			<svg
				className="w-5 h-5"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
				/>
			</svg>
		),
	},
];

function Sidebar({ mobile = false, closeSidebar }) {
	// Create a function to handle navigation item click on mobile
	const handleNavClick = () => {
		if (mobile && closeSidebar) {
			closeSidebar();
		}
	};

	return (
		<div
			className={`text-white h-full overflow-y-auto flex flex-col ${
				mobile ? 'pt-16' : 'bg-primary-800'
			}`}
		>
			{/* Logo section - only show on desktop or at top for mobile */}
			{!mobile && (
				<div className="flex items-center justify-center h-16 flex-shrink-0 px-4 bg-primary-900">
					<h2 className="text-2xl font-bold">TMS</h2>
				</div>
			)}

			{/* Mobile title */}
			{mobile && (
				<div className="flex items-center justify-center mb-8">
					<h2 className="text-3xl font-bold">Tuition Management System</h2>
				</div>
			)}

			{/* Navigation */}
			<nav className={`px-2 space-y-2 ${mobile ? 'flex-1 mt-4' : 'mt-5'}`}>
				{navItems.map((item) => (
					<NavLink
						key={item.name}
						to={item.path}
						onClick={handleNavClick}
						className={({ isActive }) =>
							`group flex items-center ${
								mobile ? 'px-4 py-4 text-xl' : 'px-2 py-2 text-base'
							} font-medium rounded-md ${
								isActive
									? 'bg-primary-900 text-white'
									: 'text-primary-100 hover:bg-primary-700 hover:text-white'
							}`
						}
					>
						<span className={`${mobile ? 'mr-4' : 'mr-3'}`}>{item.icon}</span>
						{item.name}
					</NavLink>
				))}
			</nav>

			{/* Profile section */}
			<div className="mt-auto pt-4 pb-3 border-t border-primary-700">
				<div className="flex items-center px-4">
					<div className="flex-shrink-0">
						<span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-600">
							<span className="text-lg font-medium leading-none text-white">
								A
							</span>
						</span>
					</div>
					<div className="ml-3">
						<p className="text-base font-medium text-white">Admin User</p>
						<p className="text-sm font-medium text-primary-200">
							admin@tuition.com
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Sidebar;
